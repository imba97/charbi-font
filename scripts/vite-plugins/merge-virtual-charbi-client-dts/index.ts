import fs from "node:fs";
import path from "node:path";

const FONT_FACE_DESCRIPTOR_FIELDS = ["family", "file", "weight", "style", "variant"] as const;

function extractFragmentDescriptorFields(fragment: string): string[] {
  const match = fragment.match(/interface FontFaceDescriptor\s*{([^}]*)}/);
  if (!match) {
    throw new Error("virtual-charbi.fragment.d.ts: FontFaceDescriptor not found");
  }
  return [...match[1].matchAll(/readonly\s+(\w+)\s*:/g)].map((m) => m[1]).sort();
}

function assertFragmentMatchesRuntimeTypes(fragmentPath: string, runtimeTypesPath: string): void {
  const fragment = fs.readFileSync(fragmentPath, "utf8");
  const fragmentFields = extractFragmentDescriptorFields(fragment);
  const expected = [...FONT_FACE_DESCRIPTOR_FIELDS].sort();

  if (fragmentFields.join(",") !== expected.join(",")) {
    throw new Error(
      `FontFaceDescriptor drift: fragment=[${fragmentFields.join(", ")}] runtime=[${expected.join(", ")}]`
    );
  }

  const runtimeTypes = fs.readFileSync(runtimeTypesPath, "utf8");
  for (const field of expected) {
    if (!runtimeTypes.includes(`${field}:`)) {
      throw new Error(`runtime/types.ts missing field: ${field}`);
    }
  }
}

/** 将 virtual:charbi ambient 写入 client 的 d.ts（覆盖 rollup 生成的 re-export） */
export default function mergeVirtualCharbiClientDts(): {
  name: string;
  closeBundle(): void;
} {
  return {
    name: "merge-virtual-charbi-client-dts",
    closeBundle() {
      const fragment = path.resolve("src/client/virtual-charbi.fragment.d.ts");
      const runtimeTypes = path.resolve("src/runtime/types.ts");
      if (!fs.existsSync(fragment)) return;

      assertFragmentMatchesRuntimeTypes(fragment, runtimeTypes);

      const text = fs.readFileSync(fragment, "utf8");
      for (const name of ["client.d.mts", "client.d.cts"] as const) {
        const file = path.resolve("dist", name);
        fs.writeFileSync(file, text);
      }
    }
  };
}
