// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title WorldCulinaryHeritage
 * @dev Dünya mutfak mirasını blockchain üzerinde kalıcı hale getirmek için tasarlanmıştır.
 */
contract WorldCulinaryHeritage {
    // Dünya mirası mesajı (Erişte ve Yoğurt hakkında)
    string public message;
    
    // Kontratı deploy eden kişinin adresi (Deploy anında otomatik kaydedilir)
    address public owner;

    /**
     * @dev Kontrat oluşturulduğunda mesajı kaydeder.
     * @param _message Kaydedilecek miras mesajı.
     */
    constructor(string memory _message) {
        message = _message;
        // msg.sender, işlemi başlatan (sizin) adresinizi otomatik olarak alır.
        // Buraya manuel bir adres yazmanıza gerek yoktur.
        owner = msg.sender;
    }

    /**
     * @dev Mesajı güncellemek isterseniz (Sadece sahip güncelleyebilir)
     * @param _newMessage Yeni mesaj.
     */
    function updateMessage(string memory _newMessage) public {
        require(msg.sender == owner, "Sadece sahip guncelleyebilir.");
        message = _newMessage;
    }

    /**
     * @dev Sahipliği başka bir adrese devretmek isterseniz (Opsiyonel)
     * @param _newOwner Yeni sahibin adresi.
     */
    function transferOwnership(address _newOwner) public {
        require(msg.sender == owner, "Sadece sahip transfer edebilir.");
        require(_newOwner != address(0), "Gecersiz adres.");
        owner = _newOwner;
    }
}
