-- 3. Query and Analysis
-- 3.1 Basic Listing
SELECT   [ProductName],
         [Stock]
FROM     [dbo].[Products]
WHERE    Stock < 20
ORDER BY Stock DESC;
