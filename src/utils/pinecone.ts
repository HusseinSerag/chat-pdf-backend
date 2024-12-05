import { Pinecone } from "@pinecone-database/pinecone";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { dowloadS3 } from "./s3";
import { CustomError } from "./CustomError";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { EmbedDoc, getEmbedding } from "./embeddings";
import log from "./logger";
import { convertToAscii } from "./convertToASCII";

export const pc = new Pinecone({
  apiKey: process.env.PINECONE_ACCESS_KEY!,
});

type DocPDF = {
  pageContent: string;
  metadata: {
    source: string;
    loc: {
      pageNumber: number;
    };
  };
};

export async function loadS3IntoPinecone(fileKey: string) {
  try {
    // obtain pdf -> download and read from pdf
    const fileName = await dowloadS3(fileKey);

    if (!fileName) {
      throw new CustomError("Couldn't download PDF!", 500);
    }

    // load pdf from disk

    const loader = new PDFLoader(fileName);
    const pages = (await loader.load()) as DocPDF[];

    // at this point we have an array of DocPDF in which the page content is a
    // string representation of the page

    // we want to segment the pdf
    // if doc here

    const documents = await Promise.all(pages.map(prepareDoc));
    const flattenDocs = documents.flat(1);

    // vectorize and embed documents
    const vectors = await Promise.all(flattenDocs.map(EmbedDoc));

    const pineconeIndex = pc.Index("talk-with-pdf");

    log.info("Inserting vectors in pinecone");

    const namespace = pineconeIndex.namespace(convertToAscii(fileKey));
    await namespace.upsert(vectors as any);
  } catch (e) {
    throw e;
  }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDoc(page: DocPDF) {
  try {
    let { metadata, pageContent } = page;
    pageContent = pageContent.replace(/\n/g, "");

    const splitter = new RecursiveCharacterTextSplitter();

    //splits passed in docs into multiple ones
    const docs = await splitter.splitDocuments([
      new Document({
        pageContent,
        metadata: {
          pageNumber: metadata.loc.pageNumber,
          text: truncateStringByBytes(pageContent, 36000),
        },
      }),
    ]);
    return docs;
  } catch (e) {
    throw e;
  }
}

export async function getStoredVectors(fileKey: string, vector: number[]) {
  try {
    const pineconeIndex = pc.Index("talk-with-pdf");
    const namespace = pineconeIndex.namespace(convertToAscii(fileKey));
    const returnVal = await namespace.query({
      topK: 5,
      vector,
      includeMetadata: true,
    });
    return returnVal.matches;
  } catch (e) {
    throw e;
  }
}

export async function getResponse(
  messages: {
    content: string;
    role: "data" | "system" | "user" | "assistant";
  }[],
  fileKey: string
) {
  try {
    const lastMessages = messages.at(messages.length - 1);
    const queryEmbedding = await getEmbedding(lastMessages!.content);
    const matches = getStoredVectors(fileKey, queryEmbedding);
    // type MetaData = {
    //   text: string;
    //   pageNumber: number;
    // };
    const qualifyingDocs = (await matches).filter(
      (match) => match.score && match.score > 0.7
    );
    let doc = qualifyingDocs
      .map((match) => match.metadata!.text)
      .join("\n")
      .substring(0, 3000);

    const prompt = {
      role: "system",
      content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      AI assistant is a big fan of Pinecone and Vercel.
      START CONTEXT BLOCK
      ${doc}
      END OF CONTEXT BLOCK
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
      AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
      AI assistant will not invent anything that is not drawn directly from the context.
      `,
    } as const;
    return [prompt, ...messages.filter((message) => message.role === "user")];
  } catch (e) {
    throw e;
  }
}
