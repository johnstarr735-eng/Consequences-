export type Session = { id: string; token: string; seat: string; name: string; title?: string; practice?: boolean; invite?: string | null; exchange?:number; turnNumber?:number; ended?:boolean; turn?:string; lastOpened?:number };
export type Entry = { id: string; kind: string; text: string; exchange: number; title?: string; speaker?: string; addressedTo?: string };
export type Discovery = { root: string; key?: string; title: string; text: string; mode: 'direct' | 'reported'; source: string | null; shareLabel?: string; category?: string };
export type GameView = {
  roomId: string; revision: number; seat: string; name: string; otherName: string; practice: boolean;
  exchange: number; joined: boolean; first: string; canSubmit: boolean; committed: boolean; otherCommitted: boolean;
  ownPrompt: string | null; clock: string;
  turn?:{number:number;seat:string;activeName:string;usedMinutes:number;remainingMinutes:number;availableMinutes:number;limitMinutes:number;reaction:null|{isYours:boolean;name:string;text:string;limitMinutes:number};continuing:null|{summary:string;minutes:number}};
  setup?:{phase:string;profileId:string;family:string;difficulty:string;deadlineMinutes:number;guided:boolean;generator:string;isConfirmed:boolean;confirmed:Record<string,boolean>;characters:Record<string,null|{name:string;role:string;preset?:string;background?:string;physique?:string}>};
  scenario: { id?: string; title: string; goal: string; rules: string; maxExchanges: number };
  result: { achieved: boolean; reason: string; winnerNames: string[]; debrief?: {culprit:string;method:string;sequence:string} } | null;
  entries: Entry[]; discoveries: Discovery[]; notes: string;
  surroundings: { id: string; name: string; kind: string; range: string; direction: string }[];
  condition: { status?: string; energy: number; water: number; integrity: number };
  completedExchanges: { exchange: number; minutes: number; ownPrompt: string;ownContribution?:boolean }[];
  inventory?: {id:string;name:string}[];
  knownPlaces?: {id:string;name:string}[];
  commitments?: {name:string;words:string;status:string}[];
  remainingMinutes?: number;
  agency?: {
    purpose:null|{text:string;anchors:{id:string;name:string}[]};selfAccount:string|null;
    reflections:{kind:string;text:string}[];presentations:{words:string;to:string;reached:boolean}[];
    lastAttention:null|{name:string;at:number};encounteredConduct:{text:string;source:string}[];
    heardClaims:{text:string;source:string|null}[];heldPossibility:null|{target:string;status:string};
  };
  environment?: null | {
    place:string; region:string; date:string; context:string[];
    role:{title:string;basis:string;experience:string[];limits:string[]};
    people:{name:string;role:string;basis:string}[];
    handsets:{id:string;name:string;battery:number|null;inControl:boolean;working:boolean|null}[];
    channels:null|{voice:boolean;sms:boolean;internet:boolean;wifi:boolean};
    contacts:{name:string}[];
    messages:{id:string;direction:string;name:string;channel:string;words:string;status:string}[];
  };
};
