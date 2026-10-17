declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    OPENAI_API_KEY?: string;
    OPENAI_INTENT_MODEL?: string;
    BUCKET?: R2Bucket;
  }
}
