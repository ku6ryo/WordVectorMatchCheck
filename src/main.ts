import { getEmbedding } from "./openai"
import dotenv from "dotenv"
import { randomUUID } from "crypto"
import { VectorStorage } from "./VectorStorage"
dotenv.config()
import readline from "readline"

;(async () => {
  const indexName = randomUUID()
  const vecStorage = new VectorStorage(process.env.REDIS_URL!, indexName)
  await vecStorage.connect()
  try {
    vecStorage.createIndex()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }

  const sentences = [
    "Unity パッケージファイル",
    "4/1 のミーティングのノート",
    "5月17日のミーティングのノート",
    "プレスリリースのページ",
    "企画書のスライド",
    "スケージュールのガントチャート",
    "会場の平面図",
    "会場に入るためのチケット",
    "プロジェクトの仕様書",
    "受注品の請求書",
    "受注品の納品書",
    "製品の要件定義書",
    "APIの仕様書",
    "テストの計画書",
    "タスクリスト",
    "ユーザーマニュアル",
    "モックアップ",
    "デザインの指示書",
    "ワイヤーフレーム",
    "競合分析の結果",
    "UI デザインのスライド",
    "日程調整ツール",
    "プロトタイプを試せるページの URL",
    "ビジネスモデルをまとめた書類",
    "価格表",
    "プライバシーポリシーと利用規約のドラフト",
    "セキュリティチェックリスト",
    "体制図",
    "人員配置図",
  ]
  const embeddings = await Promise.all(sentences.map(getEmbedding))

  await Promise.all(embeddings.map((embedding, i) => {
    return vecStorage.store(i.toString(), embedding)
  }))

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  while (true) {
    const text = await new Promise<string>((resolve) => {
      rl.question("input: ", function(input) {
        resolve(input)
      })
    })
    const k = 4
    const sentenceToSearch = text.trim()
    const emb = await getEmbedding(sentenceToSearch)
    const results = await vecStorage.search(emb, k)

    console.log("SEARCH QUERY: ", sentenceToSearch)
    results.documents.forEach((doc, rank) => {
      const id = doc.id.replace(`${indexName}:`, "")
      console.log("RANK:", rank)
      console.log("  Distance:", doc.value.distance)
      console.log("  Sentence:", sentences[Number(id)])
    })
    console.log("===========================")
  }
})()