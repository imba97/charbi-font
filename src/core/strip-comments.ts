// 移除注释内容，用于字符收集前的预处理

// 移除 JavaScript/TypeScript 注释
export function stripJsComments(code: string): string {
  return (
    code
      // 移除单行注释 //
      .replace(/\/\/.*$/gm, "")
      // 移除多行注释 /* */
      .replace(/\/\*[\s\S]*?\*\//g, "")
      // 移除 JSDoc 注释 /**
      .replace(/\/\*\*[\s\S]*?\*\//g, "")
  );
}

// 移除 HTML/Vue 模板注释 <!-- -->
export function stripHtmlComments(code: string): string {
  return code.replace(/<!--[\s\S]*?-->/g, "");
}

// 移除 CSS/SCSS 注释 /* */
export function stripCssComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "");
}

// 处理 Vue SFC 文件，分别处理 template、script、style 块
export function stripVueComments(code: string): string {
  let result = code;

  // 移除 template 块注释
  result = result.replace(/<template[^>]*>([\s\S]*?)<\/template>/gi, (_, content) => {
    return `<template>${stripHtmlComments(content)}</template>`;
  });

  // 移除 script 块注释
  result = result.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (_, content) => {
    return `<script>${stripJsComments(content)}</script>`;
  });

  // 移除 style 块注释
  result = result.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, content) => {
    return `<style>${stripCssComments(content)}</style>`;
  });

  return result;
}

// 根据文件扩展名移除注释
export function stripComments(code: string, ext: string): string {
  switch (ext) {
    case "vue":
      return stripVueComments(code);
    case "tsx":
    case "ts":
    case "jsx":
    case "js":
      return stripJsComments(code);
    case "scss":
    case "css":
      return stripCssComments(code);
    default:
      return code;
  }
}
