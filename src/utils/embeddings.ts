import OpenAI from "openai";
import log from "./logger";
import { Document } from "@pinecone-database/doc-splitter";
import md5 from "md5";
import { Vector } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/db_data";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getEmbedding(text: string) {
  try {
    const response = await client.embeddings.create({
      model: "text-embedding-ada-002",
      input: text.replace(/\n/g, ""),
    });

    return response.data[0].embedding as number[];
  } catch (e) {
    log.error("Error while calling openAI api");
    throw e;
  }
}

export async function EmbedDoc(doc: Document) {
  try {
    const vector = await getEmbedding(doc.pageContent);
    const hash = md5(doc.pageContent);
    return {
      values: vector,
      id: hash,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as Vector;
  } catch (e) {
    log.info("Error in EmbedDoc");
    throw e;
  }
}
