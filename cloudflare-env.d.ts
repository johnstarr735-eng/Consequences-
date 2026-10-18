declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    OPENAI_API_KEY?: string;
    OPENAI_INTENT_MODEL?: string;
    AI_PROVIDER?: string;
    OLLAMA_MODEL?: string;
    OLLAMA_BASE_URL?: string;
    BUCKET?: R2Bucket;
  }
}
