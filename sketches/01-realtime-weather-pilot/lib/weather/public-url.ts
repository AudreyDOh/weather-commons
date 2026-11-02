// Files in public/ are addressed root-relative ('/data/…'), also inside the hashed
// archive manifests. When the pilot is served under a sub-path (the GitHub Pages
// build sets NEXT_PUBLIC_BASE_PATH), prefix it; otherwise paths are unchanged.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function publicUrl(path: string): string {
  return basePath && path.startsWith('/') && !path.startsWith('//')
    ? basePath + path
    : path;
}
