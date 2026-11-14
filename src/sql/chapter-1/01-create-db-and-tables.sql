-- 1. Create Database ve Tables
-- 1.1 Create Database
CREATE DATABASE NovaStoreDB;


GO
USE NovaStoreDB;

-- 1.2 Create Tables
CREATE TABLE [dbo].[Categories] (
  [CategoryID]   INT           IDENTITY (1, 1) NOT NULL,
  [CategoryName] NVARCHAR (50) NOT NULL,
  PRIMARY KEY ([CategoryID])
);

CREATE TABLE [dbo].[Products] (
  [ProductID]   INT             IDENTITY (1, 1) NOT NULL,
  [ProductName] NVARCHAR (100)  NOT NULL,
  [Price]       DECIMAL (10, 2),
  [Stock]       INT             DEFAULT 0,
  [CategoryID]  INT            ,
  PRIMARY KEY ([ProductID]),
  CONSTRAINT FK_ProductCategory FOREIGN KEY ([CategoryId]) REFERENCES [dbo].[Categories] ([CategoryId])
);

CREATE TABLE [dbo].[Customers] (
  [CustomerID] INT           IDENTITY (1, 1) NOT NULL,
  [FullName]   NVARCHAR (50),
  [City]       NVARCHAR (20),
  [Email]      VARCHAR (100) UNIQUE,
  PRIMARY KEY ([CustomerID])
);

CREATE TABLE [dbo].[Orders] (
  [OrderID]     INT             IDENTITY (1, 1) NOT NULL,
  [CustomerID]  INT            ,
  [OrderDate]   DATETIME        DEFAULT GETDATE(),
  [TotalAmount] DECIMAL (10, 2),
  PRIMARY KEY ([OrderID]),
  CONSTRAINT FK_CustomerOrder FOREIGN KEY ([CustomerId]) REFERENCES [dbo].[Customers] ([CustomerId])
);

CREATE TABLE [dbo].[OrderDetails] (
  [DetailID]  INT IDENTITY (1, 1) NOT NULL,
  [OrderID]   INT,
  [ProductID] INT,
  [Quantity]  INT,
  PRIMARY KEY ([DetailID]),
  CONSTRAINT FK_OrderDetailOrder FOREIGN KEY ([OrderID]) REFERENCES [dbo].[Orders] ([OrderID]),
  CONSTRAINT FK_OrderDetailProduct FOREIGN KEY ([ProductID]) REFERENCES [dbo].[Products] ([ProductID])
);