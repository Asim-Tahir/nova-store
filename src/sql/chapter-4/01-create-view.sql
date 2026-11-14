-- 4. Advanced Database Objects
-- 4.1 Create View
-- To avoid constantly writing long JOIN queries; Create a VIEW named vw_OrderSummary that brings the Customer Name, Order Date, Product Name and Quantity information as if they were in a single table.
-- Topic: CREATE VIEW.
USE NovaStoreDB;


GO
CREATE VIEW dbo.vw_OrderSummary
AS
       SELECT
              c.FullName AS CustomerName,
              o.OrderDate,
              p.ProductName,
              od.Quantity
       FROM
              dbo.Customers AS c
              INNER JOIN dbo.Orders AS o ON o.CustomerID = c.CustomerID
              INNER JOIN dbo.OrderDetails AS od ON od.OrderID = o.OrderID
              INNER JOIN dbo.Products AS p ON p.ProductID = od.ProductID;


GO
SELECT
       *
FROM
       vw_OrderSummary;