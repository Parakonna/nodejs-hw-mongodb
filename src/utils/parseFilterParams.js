const parseType = (contactType) => {
  const isString = typeof contactType === 'string';
  if (!isString) return;
  const isType = (contactType) =>
    ['home', 'work', 'personal'].includes(contactType);

  if (isType(contactType)) return contactType;
};

export const parseFilterParams = (query) => {
  const { contactType } = query;

  const parsedType = parseType(contactType);

  return {
    gender: parsedType,
  };
};
