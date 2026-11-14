-- 2.4 Seed Orders
USE NovaStoreDB;

SET XACT_ABORT ON;

DECLARE @OrderMap TABLE (
  OrderDate DATETIME NOT NULL PRIMARY KEY,
  OrderID   INT      NOT NULL);

DECLARE @InsertedOrderDetails TABLE (
  DetailID INT NOT NULL);

BEGIN TRY
  BEGIN TRANSACTION;
  INSERT INTO dbo.Orders (
    CustomerID,
    OrderDate,
    TotalAmount
  )
  OUTPUT inserted.OrderDate, inserted.OrderID INTO @OrderMap (OrderDate, OrderID)
  SELECT
    customer.CustomerID,
    seed.OrderDate,
    seed.TotalAmount
  FROM
    (VALUES (N'ayse.yilmaz@example.com', CONVERT (DATETIME, '2026-01-15T10:00:00', 126), 1799.70), (N'mehmet.demir@example.com', CONVERT (DATETIME, '2026-02-20T11:30:00', 126), 1498.50), (N'elif.kaya@example.com', CONVERT (DATETIME, '2026-03-05T14:00:00', 126), 974.80), (N'can.arslan@example.com', CONVERT (DATETIME, '2026-04-12T09:15:00', 126), 1518.50), (N'zeynep.sahin@example.com', CONVERT (DATETIME, '2026-05-22T16:45:00', 126), 419.80), (N'deniz.celik@example.com', CONVERT (DATETIME, '2026-06-08T12:00:00', 126), 1149.40), (N'ayse.yilmaz@example.com', CONVERT (DATETIME, '2026-07-19T13:30:00', 126), 914.00), (N'mehmet.demir@example.com', CONVERT (DATETIME, '2026-08-25T10:30:00', 126), 1798.00)) AS seed(CustomerEmail, OrderDate, TotalAmount)
    INNER JOIN dbo.Customers AS customer ON customer.Email = seed.CustomerEmail;
  IF (SELECT
        COUNT(*)
      FROM
        @OrderMap) <> 8
    THROW 50001, 'Expected 8 orders; verify that all customer records exist.', 1;
  INSERT INTO dbo.OrderDetails (
    OrderID,
    ProductID,
    Quantity
  )
  OUTPUT inserted.DetailID INTO @InsertedOrderDetails (DetailID)
  SELECT
    orderMap.OrderID,
    product.ProductID,
    detail.Quantity
  FROM
    (VALUES (CONVERT (DATETIME, '2026-01-15T10:00:00', 126), N'Kablosuz Kulaklık', 1), (CONVERT (DATETIME, '2026-01-15T10:00:00', 126), N'Seramik Kupa Seti', 2), (CONVERT (DATETIME, '2026-02-20T11:30:00', 126), N'Bluetooth Hoparlör', 1), (CONVERT (DATETIME, '2026-02-20T11:30:00', 126), N'Masa Lambası', 1), (CONVERT (DATETIME, '2026-03-05T14:00:00', 126), N'Pamuklu Tişört', 2), (CONVERT (DATETIME, '2026-03-05T14:00:00', 126), N'Veri Yapıları Kitabı', 1), (CONVERT (DATETIME, '2026-04-12T09:15:00', 126), N'Spor Ceket', 1), (CONVERT (DATETIME, '2026-04-12T09:15:00', 126), N'Güneş Kremi SPF 50', 1), (CONVERT (DATETIME, '2026-05-22T16:45:00', 126), N'Roman Koleksiyonu', 1), (CONVERT (DATETIME, '2026-05-22T16:45:00', 126), N'Nemlendirici Krem', 1), (CONVERT (DATETIME, '2026-06-08T12:00:00', 126), N'Bluetooth Hoparlör', 1), (CONVERT (DATETIME, '2026-06-08T12:00:00', 126), N'Seramik Kupa Seti', 1), (CONVERT (DATETIME, '2026-07-19T13:30:00', 126), N'Güneş Kremi SPF 50', 2), (CONVERT (DATETIME, '2026-07-19T13:30:00', 126), N'Veri Yapıları Kitabı', 1), (CONVERT (DATETIME, '2026-08-25T10:30:00', 126), N'Spor Ceket', 1), (CONVERT (DATETIME, '2026-08-25T10:30:00', 126), N'Masa Lambası', 1)) AS detail(OrderDate, ProductName, Quantity)
    INNER JOIN @OrderMap AS orderMap ON orderMap.OrderDate = detail.OrderDate
    INNER JOIN dbo.Products AS product ON product.ProductName = detail.ProductName;
  IF (SELECT
        COUNT(*)
      FROM
        @InsertedOrderDetails) <> 16
    THROW 50002, 'Expected 16 order details; verify that all product records exist.', 1;
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0
    ROLLBACK;
  THROW;
END CATCH