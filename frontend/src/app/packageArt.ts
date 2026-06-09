const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isMlbbGame = (game: any) => {
  const text = normalize(`${game?.gamecode || ""} ${game?.name || ""}`);
  return text.includes("mlbb") || text.includes("mobile legends");
};

const isMcggGame = (game: any) => {
  const text = normalize(`${game?.gamecode || ""} ${game?.name || ""}`);
  return text.includes("magic-chess-go-go") || text.includes("magic chess");
};

const isPassPackage = (packageName: string) => {
  const text = normalize(packageName);
  return (
    text.includes("ve tuan") ||
    text.includes("goi tuan") ||
    text.includes("kim cuong tuan") ||
    text.includes("thong hanh") ||
    text.includes("elite") ||
    text.includes("epic")
  );
};

export const resolvePackageThumbnail = (game: any, pkg: any) => {
  if (!pkg) return game?.thumbnail || "";

  const packageName = String(pkg.package_name || "");

  if (isMlbbGame(game)) {
    return isPassPackage(packageName)
      ? "/package-png/mlbb-pass.png"
      : "/package-png/mlbb-diamond.png";
  }

  if (isMcggGame(game)) {
    return isPassPackage(packageName)
      ? "/package-png/mcgg-pass.png"
      : "/package-png/mcgg-diamond.png";
  }

  return pkg.thumbnail || game?.thumbnail || "";
};
