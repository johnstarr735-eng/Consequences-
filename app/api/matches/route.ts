import { env } from 'cloudflare:workers';
import { createLanguageProviders } from '@/lib/language-providers.mjs';
import { Rooms } from '@/lib/rooms.mjs';
import { GameError } from '@/lib/simulation.mjs';

export const dynamic = 'force-dynamic';

function service() {
  if (!env.DB) throw new GameError('Match storage is not available yet. Please try again shortly.', 503);
  return new Rooms(env.DB.withSession('first-primary'),createLanguageProviders(env));
}
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store, private', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' } });

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    const token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
    return json({ view: await service().read(id, token) });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin) throw new GameError('Requests must come from this app.', 403);
    if (Number(request.headers.get('Content-Length') || 0) > 12000) throw new GameError('Request too large.', 413);
    const bodyText = await request.text();
    if (bodyText.length > 12000) throw new GameError('Request too large.', 413);
    let body;
    try { body = JSON.parse(bodyText); } catch { throw new GameError('Invalid request.'); }
    const rooms = service(), token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
    const accountId=request.headers.get('oai-authenticated-user-id');
    if (body.action === 'create') return json(await rooms.create({ practice: body.practice === true,scenario:body.scenario==='last-entry'?'last-entry':'night-watch',setup:body.scenario==='last-entry'?null:body.setup||{},accountId }), 201);
    if (body.action === 'join') return json(await rooms.join(body.id, body.invite, body.playerToken,accountId));
    if (body.action === 'invite') return json(await rooms.invitation(body.id,token));
    if (body.action === 'list') return json({sessions:await rooms.listAccount(accountId),signedIn:!!accountId});
    if (body.action === 'recover') return json(await rooms.recover(accountId,body.id,body.seat));
    if (body.action === 'attach') {
      if(accountId){const row=await rooms.row(body.id);const seat=await rooms.seat(row,token);await rooms.rememberAccount(body.id,seat,token,accountId);}
      return json({linked:!!accountId});
    }
    if (body.action === 'preview') return json({ preview: await rooms.preview(body.id, token, body.prompt) });
    if (body.action === 'commit') return json({ view: await rooms.commit(body.id, token, { exchange: body.exchange, requestId: body.requestId, prompt: body.prompt,reviewId:body.reviewId }) });
    if (body.action === 'character') return json({view:await rooms.character(body.id,token,body.character)});
    if (body.action === 'ready') return json({view:await rooms.ready(body.id,token)});
    if (body.action === 'notes') return json({ view: await rooms.notes(body.id, token, body.text,body.baseText) });
    if (body.action === 'resign') return json({view:await rooms.resign(body.id,token)});
    throw new GameError('Unknown request.');
  } catch (error) {
    return failure(error);
  }
}

function failure(error: unknown) {
  if (error instanceof GameError) return json({ error: error.message }, error.status);
  console.error('Match request failed', error instanceof Error ? error.message : 'unknown');
  return json({ error: 'The request could not be saved. Your last confirmed match is safe; refresh and retry.' }, 500);
}
