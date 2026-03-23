# Base Sepolia Testnet - CoinMarketBase Deployment Guide

Bu kılavuz, **CoinMarketBase (CMB)** akıllı kontratınızı **Remix IDE** kullanarak **Base Sepolia** test ağına nasıl yükleyeceğinizi adım adım açıklar.

## 1. Hazırlık
- **MetaMask** cüzdanınızda **Base Sepolia** ağının seçili olduğundan emin olun.
- Cüzdanınızda test ETH (faucet) bulunduğundan emin olun. (Yoksa: [Base Sepolia Faucet](https://sepolia.base.org/faucet))

## 2. Remix IDE Kurulumu
1. [Remix IDE](https://remix.ethereum.org/) adresine gidin.
2. `File Explorer` kısmında yeni bir dosya oluşturun: `CoinMarketBase.sol`.
3. Projedeki `/contracts/CoinMarketBase.sol` içeriğini kopyalayıp buraya yapıştırın.

## 3. Derleme (Compile)
1. Sol taraftaki **Solidity Compiler** sekmesine tıklayın.
2. `Compiler` versiyonunu `0.8.20` veya üzeri seçin.
3. **Compile CoinMarketBase.sol** butonuna basın.

## 4. Yayınlama (Deploy)
1. Sol taraftaki **Deploy & Run Transactions** sekmesine tıklayın.
2. `Environment` kısmını **Injected Provider - MetaMask** olarak seçin. (MetaMask onay isteyecektir).
3. `Contract` listesinden `CoinMarketBase` seçili olduğundan emin olun.
4. `Deploy` butonunun yanındaki oku açın ve `initialOwner` kısmına **kendi cüzdan adresinizi** yapıştırın.
5. **transact** (Deploy) butonuna basın ve MetaMask üzerinden işlemi onaylayın.

## 5. Kontrat Adresini Kaydetme
- İşlem tamamlandığında, alt kısımdaki `Deployed Contracts` bölümünde kontrat adresinizi göreceksiniz.
- Bu adresi kopyalayın ve cüzdanınıza "Import Token" diyerek ekleyin.

Tebrikler! CoinMarketBase projesinin ilk kontratını kendi cüzdanınızla oluşturdunuz.
