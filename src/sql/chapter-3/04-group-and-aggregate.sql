-- 3.4 Group and Aggregate
-- Question: How many products do we have in total in which category? (Ex: Elektronik - 5 products).
-- Using: GROUP BY, COUNT(), LEFT JOIN.
SELECT
  c.CategoryName AS Kategori,
  COUNT(p.ProductID) AS UrunSayisi
FROM
  dbo.Categories AS c
  LEFT OUTER JOIN dbo.Products AS p ON p.CategoryID = c.CategoryID
GROUP BY
  c.CategoryID, c.CategoryName
ORDER BY
  c.CategoryName;