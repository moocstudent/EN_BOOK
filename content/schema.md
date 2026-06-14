# 内容格式说明 / Content schema

所有学习内容都是纯 JSON，前端在运行时按相对路径加载，**无需构建**。新增内容只要按下面的格式增删条目即可。

## 词汇文件 `content/vocab/<band>.json`

`<band>` 为 `junior` / `senior` / `college`。

```json
{
  "band": "junior",
  "bandLabel": "初中英语",
  "bandLabelEn": "Junior High",
  "units": [
    {
      "id": "u1",
      "title": "校园生活",
      "titleEn": "School Life",
      "words": [
        {
          "word": "schedule",
          "phonetic": "/ˈskedʒ.uːl/",
          "pos": "n.",
          "meaning": "日程表；课程表",
          "example": "Check the class schedule before Monday.",
          "exampleZh": "周一前看一下课程表。"
        }
      ]
    }
  ]
}
```

字段：`word` 英文单词 · `phonetic` 音标 · `pos` 词性(n./v./adj.…) · `meaning` 中文释义 · `example` 英文例句 · `exampleZh` 例句中文。

## 语法文件 `content/grammar/<band>.json`

```json
{
  "band": "junior",
  "bandLabel": "初中英语",
  "bandLabelEn": "Junior High",
  "topics": [
    {
      "id": "g1",
      "title": "一般现在时",
      "titleEn": "Simple Present Tense",
      "summary": "表示习惯性动作、客观事实和真理。",
      "sections": [
        { "heading": "用法", "body": "1) 习惯动作…\n2) 客观真理…" },
        { "heading": "结构", "body": "肯定：主语 + 动词原形（第三人称单数 +s/es）" }
      ],
      "examples": [
        { "en": "She goes to school by bus.", "zh": "她乘公交车上学。", "note": "第三人称单数动词 + es" }
      ],
      "tips": ["第三人称单数主语，动词加 -s/-es", "频度副词 always/usually 常与之连用"]
    }
  ]
}
```

`sections[].body` 支持 `\n` 换行（前端按多行渲染）。`examples[].note` 可省略。

## 注册新学段 / 改计数

`content/manifest.json` 列出书架上的每一本「书」（学段）。`vocabCount` / `grammarCount` 用于书架展示，可在增改内容后更新。
