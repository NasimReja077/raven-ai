
// src/config/pinecone.config.js
import { Pinecone } from '@pinecone-database/pinecone'

let pineconeIndex

export async function getPineconeIndex() {
  if (pineconeIndex) return pineconeIndex
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
  pineconeIndex = pc.index(process.env.PINECONE_INDEX)
  return pineconeIndex
}