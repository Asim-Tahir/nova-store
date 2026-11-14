-- 2.3 Seed Customers
USE [NovaStoreDB];

INSERT  INTO [dbo].[Customers] (
  [FullName],
  [City],
  [Email]
)
VALUES                         (N'Ayse Yilmaz', N'Istanbul', N'ayse.yilmaz@example.com'),
                               (N'Mehmet Demir', N'Ankara', N'mehmet.demir@example.com'),
                               (N'Elif Kaya', N'Izmir', N'elif.kaya@example.com'),
                               (N'Can Arslan', N'Bursa', N'can.arslan@example.com'),
                               (N'Zeynep Sahin', N'Antalya', N'zeynep.sahin@example.com'),
                               (N'Deniz Celik', N'Eskisehir', N'deniz.celik@example.com');