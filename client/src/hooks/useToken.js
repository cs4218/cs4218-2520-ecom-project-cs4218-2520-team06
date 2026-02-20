import axios from "axios";
import { useEffect, useState } from "react";

export const useToken = (authToken) => {
  const [clientToken, setClientToken] = useState("");

  //get payment gateway token
  const getToken = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/braintree/token");

      setClientToken(data?.clientToken);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getToken();
  }, [authToken]);

  return clientToken;
};
