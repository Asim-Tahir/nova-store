-- 3.2 Data Join
-- Question: Which customer placed the order on which date? The result will show Customer Name, City, Order Date and Total Amount.
-- Using: INNER JOIN (Customers and Orders tables).
SELECT   c.FullName AS MusteriAdi,
         c.City AS Sehir,
         o.OrderDate AS SiparisTarihi,
         o.TotalAmount AS ToplamTutar
FROM     dbo.Customers AS c
INNER JOIN dbo.Orders AS o ON o.CustomerID = c.CustomerID
ORDER BY o.OrderDate DESC;