import { deleteChat, getChatById, getMessagesByChatId } from "@/lib/db/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chat = await getChatById(id);
  if (!chat) {
    return new Response("Not found", { status: 404 });
  }
  const rows = await getMessagesByChatId(id);
  const messages = rows.map((row) => ({
    id: row.id,
    role: row.role,
    parts: row.parts,
  }));
  return Response.json({ chat, messages });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteChat(id);
  return Response.json({ ok: true });
}
