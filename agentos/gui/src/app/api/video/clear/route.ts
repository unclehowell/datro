import { NextResponse } from "next/server";
import { readdir, unlink, stat } from "fs/promises";
import { join } from "path";

const VIDEO_DIR = "/home/unclehowell/agentos-gui/remotion/out";

export async function DELETE() {
  try {
    const files = await readdir(VIDEO_DIR);
    const mp4Files = files.filter((f) => f.endsWith(".mp4"));

    if (mp4Files.length === 0) {
      return NextResponse.json({ reply: "No videos to delete.", deleted: 0 });
    }

    let deleted = 0;
    for (const f of mp4Files) {
      try {
        await unlink(join(VIDEO_DIR, f));
        deleted++;
      } catch {}
    }

    return NextResponse.json({
      reply: `Deleted ${deleted} video${deleted === 1 ? "" : "s"}.`,
      deleted,
    });
  } catch (err) {
    return NextResponse.json({ reply: "Failed to clear storage.", error: String(err) }, { status: 500 });
  }
}
