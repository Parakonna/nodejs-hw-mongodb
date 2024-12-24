export const calcPaginationData = ({ total, page, perPage }) => {
  const totalPages = Math.ceil(total / perPage);
  const hasNexPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    totalPages,
    hasNexPage,
    hasPrevPage,
  };
};
