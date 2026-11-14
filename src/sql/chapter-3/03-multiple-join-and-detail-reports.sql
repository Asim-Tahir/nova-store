-- 3.3 Multiple Join and Detail Reports
-- Question: List the names, prices, and categories of products purchased by customer named "Ahmet Yılmaz" (or a customer in your data).
-- Using: JOIN (Customers, Orders, OrderDetails, Products, Categories tables will be chained).
SELECT
  c.FullName AS MusteriAdi,
  p.ProductName AS UrunAdi,
  p.Price AS Fiyat,
  cat.CategoryName AS Kategori,
  od.Quantity AS Adet
FROM
  dbo.Customers AS c
  INNER JOIN dbo.Orders AS o ON o.CustomerID = c.CustomerID
  INNER JOIN dbo.OrderDetails AS od ON od.OrderID = o.OrderID
  INNER JOIN dbo.Products AS p ON p.ProductID = od.ProductID
  INNER JOIN dbo.Categories AS cat ON cat.CategoryID = p.CategoryID
WHERE
  c.FullName = N'Ayşe Yılmaz'
ORDER BY
  o.OrderDate, p.ProductName;