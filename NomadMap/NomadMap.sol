// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract NomadMap {
    struct Location {
        uint256 id;
        string name;
        string description;
        string imageIPFS;
        int256 lat;
        int256 long;
        string category;
        uint256 totalCheckIns;
        address creator;
    }

    uint256 public locationCount;
    mapping(uint256 => Location) public locations;
    mapping(address => mapping(uint256 => bool)) public hasCheckedIn;

    event NewLocationAdded(uint256 id, string name, address creator);
    event UserCheckIn(address indexed user, uint256 locationId, uint256 timestamp);

    function addLocation(
        string memory _name,
        string memory _description,
        string memory _imageIPFS,
        int256 _lat,
        int256 _long,
        string memory _category
    ) public {
        locationCount++;
        locations[locationCount] = Location(
            locationCount,
            _name,
            _description,
            _imageIPFS,
            _lat,
            _long,
            _category,
            0,
            msg.sender
        );

        emit NewLocationAdded(locationCount, _name, msg.sender);
    }

    function checkIn(uint256 _locationId) public {
        require(_locationId > 0 && _locationId <= locationCount, "Gecersiz lokasyon");
        require(!hasCheckedIn[msg.sender][_locationId], "Zaten check-in yaptiniz");

        locations[_locationId].totalCheckIns++;
        hasCheckedIn[msg.sender][_locationId] = true;

        emit UserCheckIn(msg.sender, _locationId, block.timestamp);
    }
}
