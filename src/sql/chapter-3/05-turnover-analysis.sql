-- 3.5 Turnover Analysis
-- Question: What is the total turnover each customer brings to the company? Sort from highest spending customer to least.
-- Using: SUM(), GROUP BY, ORDER BY.
SELECT
  c.FullName AS MusteriAdi,
  SUM(o.TotalAmount) AS ToplamCiro
FROM
  dbo.Customers AS c
  LEFT OUTER JOIN dbo.Orders AS o ON o.CustomerID = c.CustomerID
GROUP BY
  c.CustomerID, c.FullName
ORDER BY
  ToplamCiro DESC, c.FullName ASC;