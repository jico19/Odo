/** Photos are not stored on web; the native implementation does the real work. */
export async function copyIntoAppDocuments(): Promise<string | null> {
  return null;
}

export async function deleteQuietly(): Promise<void> {
  return undefined;
}
