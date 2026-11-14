-- Destructive: drops NovaStoreDB and all tables/data in it.
USE master;


GO
IF DB_ID(N'NovaStoreDB') IS NOT NULL
  BEGIN
    ALTER DATABASE NovaStoreDB
      SET SINGLE_USER 
      WITH ROLLBACK IMMEDIATE;
    DROP DATABASE NovaStoreDB;
  END