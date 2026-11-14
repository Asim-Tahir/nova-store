-- 3.6 Time Analysis
-- Question: Write a query that calculates how many days it has been since orders were placed, based on today's date.
-- Using: DATEDIFF(), GETDATE().
SELECT
  OrderID,
  OrderDate,
  DATEDIFF(DAY, OrderDate, GETDATE()) AS GecenGun
FROM
  dbo.Orders
ORDER BY
  OrderDate;