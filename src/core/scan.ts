import type { ExtraText, ResolvedConfig } from "../config/schema";
import fs from "node:fs";
import path from "node:path";
import consola from "consola";
import fg from "fast-glob";
import { DEFAULT_CHARS } from "../utils/defaults";
import { stripComments } from "./strip-comments";

// 从文本中提取字符
function extractCharsFromText(text: string, charSet: Set<string>): void {
  // 提取中文字符
  const chinese = text.match(/[\u4E00-\u9FA5]/g) || [];
  chinese.forEach((c) => charSet.add(c));

  // 提取数字
  const numbers = text.match(/\d/g) || [];
  numbers.forEach((c) => charSet.add(c));

  // 提取英文字母
  const letters = text.match(/[a-z]/gi) || [];
  letters.forEach((c) => charSet.add(c));

  // 提取常用符号
  const symbols =
    text.match(/[·.,;:!?@#$%^&*()_+\-=[\]{}|\\/"'<>，。；：！？、【】《》「」『』（）]/g) || [];
  symbols.forEach((c) => charSet.add(c));
}

function normalizeExtraText(extraText?: ExtraText): string[] {
  if (!extraText) {
    return [];
  }

  return Array.isArray(extraText) ? extraText : [extraText];
}

function appendLiteralChars(texts: string[], charSet: Set<string>): void {
  for (const text of texts) {
    for (const char of text) {
      if (char.trim()) {
        charSet.add(char);
      }
    }
  }
}

// 收集使用的字符
export async function collectChars(config: ResolvedConfig): Promise<Set<string>> {
  consola.info("扫描项目文件...");

  const patterns = config.scan.srcDir.flatMap((dir) =>
    config.scan.extensions.map((ext) => `${dir}/**/*.${ext}`)
  );

  const files = await fg(patterns, {
    cwd: config.root,
    absolute: false,
    onlyFiles: true
  });

  consola.info(`   找到 ${files.length} 个文件`);

  const charSet = new Set<string>();

  for (const file of files) {
    const content = fs.readFileSync(path.join(config.root, file), "utf-8");
    const ext = file.split(".").pop() || "";

    // 移除注释后再提取字符
    const strippedContent = stripComments(content, ext);
    extractCharsFromText(strippedContent, charSet);
  }

  appendLiteralChars(normalizeExtraText(config.scan.extraText), charSet);
  consola.info(`   收集到 ${charSet.size} 个唯一字符`);

  // 添加默认字符集
  for (const char of DEFAULT_CHARS) {
    charSet.add(char);
  }
  consola.info(`   添加默认字符集后共 ${charSet.size} 个字符`);

  return charSet;
}
