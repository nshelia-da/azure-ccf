provider "azurerm" {
  features {}
  skip_provider_registration = true

}

resource "azurerm_resource_group" "main" {
  name     = "ccf-resources"
  location = "East US"
}

resource "azurerm_storage_account" "main" {
  name                     = "ccf-storage-account"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "write_container" {
  name                  = "result-container"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_queue" "queue_details" {
  name                 = "processor-queue"
  storage_account_name = azurerm_storage_account.main.name
}
