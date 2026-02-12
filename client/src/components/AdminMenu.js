import React from "react";
import { NavLink } from "react-router-dom";

export const CREATE_CATEGORY_URL = "/dashboard/admin/create-category";
export const CREATE_PRODUCT_URL = "/dashboard/admin/create-product";
export const PRODUCTS_URL = "/dashboard/admin/products";
export const ORDERS_URL = "/dashboard/admin/orders";
export const USERS_URL = "/dashboard/admin/users";

const AdminMenu = () => {
  return (
    <>
      <div className="text-center">
        <div className="list-group dashboard-menu">
          <h4>Admin Panel</h4>
          <NavLink
            to={CREATE_CATEGORY_URL}
            className="list-group-item list-group-item-action"
          >
            Create Category
          </NavLink>
          <NavLink
            to={CREATE_PRODUCT_URL}
            className="list-group-item list-group-item-action"
          >
            Create Product
          </NavLink>
          <NavLink
            to={PRODUCTS_URL}
            className="list-group-item list-group-item-action"
          >
            Products
          </NavLink>
          <NavLink
            to={ORDERS_URL}
            className="list-group-item list-group-item-action"
          >
            Orders
          </NavLink>
          <NavLink
            to={USERS_URL}
            className="list-group-item list-group-item-action"
          >
            Users
          </NavLink>
        </div>
      </div>
    </>
  );
};

export default AdminMenu;
