import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.webp'];

function imageExtension(hint: string): string {
  const extension = Paths.extname(hint).toLowerCase();
  return IMAGE_EXTENSIONS.includes(extension) ? extension : '.jpg';
}

function uniqueName(prefix: string, hint: string): string {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${id}${imageExtension(hint)}`;
}

/** Copies a picked image into the app's private document directory. */
export async function copyIntoAppDocuments(
  subdirectory: string,
  sourceUri: string,
  prefix: string,
  fileNameHint?: string | null
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const directory = new Directory(Paths.document, subdirectory);
    if (!directory.exists) directory.create();

    const destination = new File(directory, uniqueName(prefix, fileNameHint ?? sourceUri));
    await new File(sourceUri).copy(destination);
    return destination.uri;
  } catch {
    return null;
  }
}

/** Deletes a private file. A missing file is not an error. */
export async function deleteQuietly(uri: string | null): Promise<void> {
  if (uri === null || Platform.OS === 'web') return;

  try {
    new File(uri).delete();
  } catch {
    // The file was already removed or is no longer readable.
  }
}
