pragma solidity ^0.7.0;


import { Helpers } from "./helpers.sol";
import { AccountInterface } from "../../common/interfaces.sol";
import { Basic } from "../../common/basic.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract Admin is Helpers, Basic, Ownable {

    function updateMinAmount(uint _minAmount) external onlyOwner {
        minAmount = _minAmount;
    }

    function updatePriceSlippage(uint _priceSlippage) external onlyOwner {
        priceSlippage = _priceSlippage;
    }

    function toggleRoute(uint _route) external onlyOwner {
        route[_route] = !route[_route];
    }

    function enableRouteTokens(uint _route, address[] memory _tokens) external onlyOwner {
        require(route[_route], "route-not-enabled");
        for (uint i = 0; i < routeTokensArray[_route].length; i++) {
            delete routeTokenAllowed[_route][routeTokensArray[_route][i]];
        }
        routeTokensArray[_route] = _tokens;
        for (uint i = 0; i < routeTokensArray[_route].length; i++) {
            routeTokenAllowed[_route][routeTokensArray[_route][i]] = true;
        }
    }

}

contract DeFiLimitOrder is Admin {
    using SafeERC20 for IERC20;

    function create(address _tokenFrom, address _tokenTo, uint128 _price, uint32 _route, bytes8 _pos) public isDSA {
        require(route[_route], "wrong-route");
        checkPrice(_price);
        bytes32 _key = encodeTokenKey(_tokenFrom, _tokenTo);
        bytes8 _key2 = encodeDsaKey(msg.sender, _route);
        // check if user's order already exists or not if yes then cancel it and then create new one.
        OrderLink memory _link = ordersLinks[_key];
        if (_pos == bytes8(0)) {
            if (_link.first == bytes8(0) && _link.last == bytes8(0) && _link.count == 0) { // if no previous order in the list
                ordersLists[_key][_key2] = OrderList(bytes8(0), bytes8(0), _price, _route, _tokenFrom, _tokenTo, msg.sender);
                ordersLinks[_key].first = _key2;
                ordersLinks[_key].last = _key2;
                ordersLinks[_key].count++;
            } else {
                OrderList memory _order = ordersLists[_key][_link.first];
                require(_price <= _order.price, "wrong-pos-1");
                ordersLists[_key][_key2] = OrderList(bytes8(0), _link.first, _price, _route, _tokenFrom, _tokenTo, msg.sender);
                ordersLists[_key][_link.first].prev = _key2;
                ordersLinks[_key].first = _key2;
                ordersLinks[_key].count++;
            }
        } else {
            OrderList memory _posExistingOrder = ordersLists[_key][_pos];
            if (_posExistingOrder.next == bytes8(0)) {
                require(_posExistingOrder.price <= _price, "wrong-pos-2");
                ordersLists[_key][_key2] = OrderList(_pos, bytes8(0), _price, _route, _tokenFrom, _tokenTo, msg.sender);
                ordersLists[_key][_pos].next = _key2;
                ordersLinks[_key].last = _key2;
                ordersLinks[_key].count++;
            } else {
                OrderList memory _posNextOrder = ordersLists[_key][_posExistingOrder.next];
                require(_posExistingOrder.price <= _price && _price <= _posNextOrder.price, "wrong-pos-2");
                ordersLists[_key][_key2] = OrderList(_pos, _posExistingOrder.next, _price, _route, _tokenFrom, _tokenTo, msg.sender);
                ordersLists[_key][_pos].next = _key2;
                ordersLists[_key][_posExistingOrder.next].prev = _key2;
                ordersLinks[_key].count++;
            }
        }
    }

    function create(address _tokenFrom, address _tokenTo, uint128 _price, uint32 _route) external isDSA {
        bytes32 _key = encodeTokenKey(_tokenFrom, _tokenTo);
        bytes8 _pos = findCreatePos(_key, _price);
        create(_tokenFrom, _tokenTo, _price, _route, _pos);
    }

    function _sell(address _tokenFrom, address _tokenTo, uint _amountFrom, bytes8 _orderId) internal returns (uint _amountTo) {
        bytes32 _key = encodeTokenKey(_tokenTo, _tokenFrom); // inverse the params to get key as user is filling
        OrderList memory _order = ordersLists[_key][_orderId];
        IERC20 _tokenFromContract = IERC20(_tokenFrom);
        IERC20 _tokenToContract = IERC20(_tokenTo);
        uint _amountFrom18 = convertTo18(_tokenFromContract.decimals(), _amountFrom);
        uint _amountTo18 = wdiv(_amountFrom18, _order.price);
        _amountTo = convert18ToDec(_tokenToContract.decimals(), _amountTo18);

        _tokenFromContract.safeTransfer(_order.dsa, _amountFrom);
        AccountInterface(_order.dsa).castLimitOrder(_tokenFrom, _tokenFrom, _amountFrom, _amountTo, _order.route);
    }

    function sell(address _tokenFrom, address _tokenTo, uint _amountFrom, bytes8 _orderId, address _to) external returns (uint _amountTo) {
        IERC20(_tokenFrom).safeTransferFrom(msg.sender, address(this), _amountFrom);
        _amountTo = _sell(_tokenFrom, _tokenTo, _amountFrom, _orderId);
        IERC20(_tokenTo).safeTransfer(_to, _amountTo);
    }

    function sell(
        address _tokenFrom,
        address _tokenTo,
        uint _amountFrom,
        bytes8[] memory _orderIds,
        uint[] memory _distributions,
        uint _units,
        address _to
    ) external returns (uint _amountTo) {
        IERC20(_tokenFrom).safeTransferFrom(msg.sender, address(this), _amountFrom);
        for (uint i = 0; i < _distributions.length; i++) {
            uint _amountFromPerOrder = div(mul(_amountFrom, _distributions[i]), _units);
            _amountTo = add(_amountTo, _sell(_tokenFrom, _tokenTo, _amountFromPerOrder, _orderIds[i]));
        }
        IERC20(_tokenTo).safeTransfer(_to, _amountTo);
    }

    // minAmount = minimum order amount to be used for swaps
    function sell(address _tokenFrom, address _tokenTo, uint _amountFrom, uint _minAmount, address _to) public returns (uint _amountTo) {

    }

    function _cancel(bytes32 _key, OrderList memory _order, bytes8 _orderId) internal {
        ordersLinks[_key].count--;
        if (_order.prev == bytes8(0)) {
            ordersLinks[_key].first = _order.next;
        }
        if (_order.next == bytes8(0)) {
            ordersLinks[_key].last = _order.prev;
        }
        if (_order.prev != bytes8(0)) {
            ordersLists[_key][_order.prev].next = _order.next;
        }
        if (_order.next != bytes8(0)) {
            ordersLists[_key][_order.next].prev = _order.prev;
        }
        delete ordersLists[_key][_orderId];
    }

    function cancel(address _tokenFrom, address _tokenTo, bytes8 _orderId) public {
        bytes32 _key = encodeTokenKey(_tokenFrom, _tokenTo);
        OrderList memory _order = ordersLists[_key][_orderId];
        _cancel(_key, _order, _orderId);
    }

    function cancelPublic(address _tokenFrom, address _tokenTo, bytes8 _orderId) public {
        bytes32 _key = encodeTokenKey(_tokenFrom, _tokenTo);
        OrderList memory _order = ordersLists[_key][_orderId];
        // check is the limit order requirement is less than minAmount
        _cancel(_key, _order, _orderId);
    }

}