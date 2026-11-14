-- 3. Query and Analysis
-- 3.1 Basic Listing
-- Question: List the name and stock quantity of products with less than 20 items in stock in "DESCENDING" order by stock quantity.
-- Using: SELECT, WHERE, ORDER BY.
SELECT   ProductName,
         Stock
FROM     dbo.Products
WHERE    Stock < 20
ORDER BY Stock DESC, ProductName ASC;