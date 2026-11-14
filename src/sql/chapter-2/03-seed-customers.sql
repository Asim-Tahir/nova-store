-- 2.3 Seed Customers
USE NovaStoreDB;

INSERT INTO dbo.Customers (
  FullName,
  City,
  Email
)
VALUES                    (N'Ayşe Yılmaz', N'İstanbul', N'ayse.yilmaz@example.com'),
                          (N'Mehmet Demir', N'Ankara', N'mehmet.demir@example.com'),
                          (N'Elif Kaya', N'İzmir', N'elif.kaya@example.com'),
                          (N'Can Arslan', N'Bursa', N'can.arslan@example.com'),
                          (N'Zeynep Şahin', N'Antalya', N'zeynep.sahin@example.com'),
                          (N'Deniz Çelik', N'Eskişehir', N'deniz.celik@example.com');