import { Embeddings, EmbeddingsParams } from "@langchain/core/embeddings";

type TransformersModule = typeof import("@xenova/transformers");

let transformersModule: TransformersModule | null = null;

async function getTransformers(): Promise<TransformersModule> {
  if (typeof window === "undefined") {
    throw new Error("Embeddings are only available in the browser");
  }
  if (!transformersModule) {
    transformersModule = await import("@xenova/transformers");
    transformersModule.env.allowLocalModels = false;
    transformersModule.env.allowRemoteModels = true;
  }
  return transformersModule;
}

export interface XenovaTransformersEmbeddingsParams extends EmbeddingsParams {
  model?: string;
}

export class XenovaTransformersEmbeddings
  extends Embeddings
  implements XenovaTransformersEmbeddingsParams
{
  model: string;
  client: any;

  constructor(fields?: XenovaTransformersEmbeddingsParams) {
    super(fields ?? {});
    this.model = fields?.model ?? "Xenova/all-MiniLM-L6-v2";
  }

  async _embed(texts: string[]): Promise<number[][]> {
    if (!this.client) {
      const { pipeline } = await getTransformers();
      this.client = await pipeline("feature-extraction", this.model);
    }

    return this.caller.call(async () => {
      return await Promise.all(
        texts.map(
          async (t) =>
            (
              await this.client(t, {
                pooling: "mean",
                normalize: true,
              })
            ).data
        )
      );
    });
  }

  embedQuery(document: string): Promise<number[]> {
    return this._embed([document]).then((embeddings) => embeddings[0]);
  }

  embedDocuments(documents: string[]): Promise<number[][]> {
    return this._embed(documents);
  }
}

let embeddingsInstance: XenovaTransformersEmbeddings | null = null;

export async function getEmbeddingsInstance(): Promise<XenovaTransformersEmbeddings> {
  if (!embeddingsInstance) {
    embeddingsInstance = new XenovaTransformersEmbeddings();
    await embeddingsInstance._embed(["initialization"]);
  }
  return embeddingsInstance;
}
