-- 2.2 Seed Products
USE [NovaStoreDB];

INSERT INTO [dbo].[Products] (
  [ProductName],
  [Price],
  [Stock],
  [CategoryID]
)
SELECT seed.[ProductName],
       seed.[Price],
       seed.[Stock],
       category.[CategoryID]
FROM   (VALUES (N'Kablosuz Kulaklik', 1299.90, 25, N'Elektronik'), (N'Bluetooth Hoparlor', 899.50, 18, N'Elektronik'), (N'Pamuklu Tisort', 349.90, 40, N'Giyim'), (N'Spor Ceket', 1199.00, 12, N'Giyim'), (N'Veril Yapilari Kitabi', 275.00, 15, N'Kitap'), (N'Roman Koleksiyonu', 189.90, 22, N'Kitap'), (N'Nemlendirici Krem', 229.90, 30, N'Kozmetik'), (N'Gunes Kremi SPF 50', 319.50, 20, N'Kozmetik'), (N'Seramik Kupa Seti', 249.90, 16, N'Ev ve Yaşam'), (N'Masa Lambasi', 599.00, 10, N'Ev ve Yaşam')) AS seed([ProductName], [Price], [Stock], [CategoryName])
       INNER JOIN
       [dbo].[Categories] AS category
       ON category.[CategoryName] = seed.[CategoryName];