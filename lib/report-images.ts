export type ReportImageSection = { title: string; body: string };

// Break by Unicode code point so Korean text and long unspaced answers fit.
export function wrapImageText(text: string, measure: (text: string) => number, width: number) {
  return text.replace(/\r\n?/g, "\n").split("\n").flatMap((paragraph) => {
    const lines: string[] = [];
    let line = "";
    for (const char of paragraph) {
      if (line && measure(line + char) > width) {
        lines.push(line);
        line = char;
      } else line += char;
    }
    lines.push(line);
    return lines;
  });
}

export async function createReportImages(title: string, sections: ReportImageSection[]) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 만들 수 없습니다.");
  const files: File[] = [];
  let y = 0;
  const startPage = () => {
    ctx.fillStyle = "#f8f7f4";
    ctx.fillRect(0, 0, 1080, 1440);
    ctx.fillStyle = "#66615b";
    ctx.font = "22px sans-serif";
    ctx.fillText("THE MORNING PAGE INTERVIEW", 72, 72);
    ctx.fillText(title, 72, 112, 936);
    ctx.fillStyle = "#24211e";
    y = 190;
  };
  const finishPage = async () => {
    ctx.fillStyle = "#66615b";
    ctx.font = "22px sans-serif";
    ctx.fillText(String(files.length + 1).padStart(2, "0"), 970, 1380);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      (value) => value ? resolve(value) : reject(new Error("이미지 생성에 실패했습니다.")), "image/png"));
    files.push(new File([blob], `morningpage-${files.length + 1}.png`, { type: "image/png" }));
  };
  startPage();
  for (const section of sections) {
    for (const [text, heading] of [[section.title, true], [section.body, false]] as const) {
      const font = heading ? "600 36px sans-serif" : "30px sans-serif";
      ctx.font = font;
      const lines = wrapImageText(text, (line) => ctx.measureText(line).width, 936);
      for (const line of lines) {
        if (y > 1290) {
          await finishPage();
          startPage();
        }
        ctx.fillStyle = "#24211e";
        ctx.font = font;
        ctx.fillText(line, 72, y);
        y += 48;
      }
      y += 20;
    }
    y += 24;
  }
  await finishPage();
  canvas.width = canvas.height = 0;
  return files;
}
