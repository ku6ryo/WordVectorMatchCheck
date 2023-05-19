import { createClient, RedisClientType, SchemaFieldTypes, VectorAlgorithms } from "redis"

function float32Buffer(arr: number[]) {
  return Buffer.from(new Float32Array(arr).buffer)
}

export class IndexAlreadyExistsError extends Error {
  constructor() {
    super("Index already exists")
  }
}

export class VectorStorage {

  private client: RedisClientType
  private indexName: string

  constructor(connectionUrl: string, indexName: string) {
    this.client = createClient({
      url: connectionUrl
    })
    this.indexName = indexName
  }

  async connect() {
    await this.client.connect()
  }

  async disconnect() {
    await this.client.quit()
  }

  async createIndex() {
    try {
      await this.client.ft.create(this.indexName, {
        v: {
          type: SchemaFieldTypes.VECTOR,
          ALGORITHM: VectorAlgorithms.HNSW,
          TYPE: "FLOAT32",
          DIM: 1536,
          DISTANCE_METRIC: "COSINE"
        }
      }, {
        ON: "HASH",
        PREFIX: this.indexName
      });
    } catch (e) {
      if (e instanceof Error && e.message === "Index already exists") {
        throw new IndexAlreadyExistsError()
      } else {
        throw e
      }
    }
  }

  async store(id: string, vec: number[]) {
    await this.client.hSet(`${this.indexName}:${id}`, {
      v: float32Buffer(vec)
    })
  }

  async search(vec: number[], k: number) {
    return await this.client.ft.search(
      this.indexName,
      `*=>[KNN ${k} @v $BLOB AS distance]`,
      {
        PARAMS: {
          BLOB: float32Buffer(vec)
        },
        SORTBY: "distance",
        DIALECT: 2,
        RETURN: ["distance"]
      }
    )
  }
}