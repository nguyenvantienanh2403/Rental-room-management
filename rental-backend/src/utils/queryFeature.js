import slugify from "slugify";

export const buildQueryOptions = (keyword, sortBy, sortOrder) => {
  const filter = {};
  const sort = {};

  // 1. Xử lý Sort ĐỘC LẬP
  if (sortBy && ["asc", "desc"].includes(sortOrder)) {
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;
  }

  // 2. Xử lý Keyword ĐỘC LẬP
  if (keyword) {
    const keywordSlug = slugify(keyword, {
      replacement: "-",
      remove: undefined,
      lower: true,
      strict: true,
      locale: "vi",
      trim: true,
    });

    const regKeyword = new RegExp(keywordSlug, "i");
    filter.$or = [
      {
        slug: regKeyword,
      },
    ];
  }

  return { filter, sort };
};

export default buildQueryOptions;
