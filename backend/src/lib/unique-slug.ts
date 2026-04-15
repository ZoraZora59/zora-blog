export async function resolveUniqueSlug(
  baseSlug: string,
  exists: (slug: string) => Promise<boolean>,
) {
  let candidate = baseSlug;
  let counter = 1;

  while (await exists(candidate)) {
    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }

  return candidate;
}
