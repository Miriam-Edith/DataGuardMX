

describe('getUserReports', () => {
  it('debe retornar array vacío si usuario no tiene reportes', async () => {
    const result = await getUserReports(999);
    expect(result).toEqual([]);
  });
});