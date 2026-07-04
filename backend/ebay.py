import token

import requests
import base64
import os
import json
from datetime import datetime, timezone
from dotenv import load_dotenv
import sys
import random
import unicodedata
import re

load_dotenv()

class EbayCollector:
    def __init__(self):
        self.client_id = os.getenv("EBAY_CLIENT_ID")
        self.client_secret = os.getenv("EBAY_CLIENT_SECRET")

    def get_access_token(self):
        url = "https://api.ebay.com/identity/v1/oauth2/token"
        auth_str = f"{self.client_id}:{self.client_secret}"
        b64_auth = base64.b64encode(auth_str.encode()).decode()

        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"Basic {b64_auth}"
        }
        data = {
            "grant_type": "client_credentials",
            "scope": "https://api.ebay.com/oauth/api_scope"
        }

        try:
            r = requests.post(url, headers=headers, data=data, timeout=10)
            return r.json().get('access_token')
        except Exception as e:
            print(f"Exception lors de l'authentification eBay API: {e} à la ligne {e.__traceback__.tb_lineno}")
            return None

    def get_auctions(
        self,
        query,
        min_price=None,
        max_price=None,
    ):
        token = self.get_access_token()
        if not token:
            return []
        
        url = "https://api.ebay.com/buy/browse/v1/item_summary/search"
        headers = {
            "Authorization": f"Bearer {token}",
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_FR" 
        }
        
        filters = ["buyingOptions:{AUCTION}"]
        if min_price is not None or max_price is not None:
            if min_price is None:
                price_filter = f"price:[*..{max_price}]"
            elif max_price is None:
                price_filter = f"price:[{min_price}..*]"
            else:
                price_filter = f"price:[{min_price}..{max_price}]"
            filters.append(price_filter)
        
        filters.append("priceCurrency:EUR")
        
        all_products = []
        offset = 0
        
        while True:
            params = {
                "q": query,
                "limit": 200,
                "offset": offset,
                "filter": ",".join(filters)
            }
            
            try:
                r = requests.get(url, headers=headers, params=params, timeout=10)
                if r.status_code != 200:
                    print(f"Erreur lors de la récupération des enchères eBay: {r.status_code} - {r.text}")
                    break
                
                print(f"Récupération des enchères eBay pour la requête '{query}' avec offset {offset}, min_price {min_price}, max_price {max_price}")
                data = r.json()
                products = data.get("itemSummaries", [])
                
                if not products:
                    break
                
                all_products.extend(products)
                
                if len(products) < 200:
                    break
                
                offset += 200
            except Exception as e:
                print(f"Exception lors de la récupération des enchères eBay: {e}")
                break
        
        return all_products

    def get_product_details(self, item_id):
        token = self.get_access_token()
        if not token:
            return None
        
        url = f"https://api.ebay.com/buy/browse/v1/item/v1|{item_id}|0"
        headers = {
            "Authorization": f"Bearer {token}",
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_FR"
        }
        
        try:
            r = requests.get(url, headers=headers, timeout=10)
            if r.status_code != 200:
                print(f"Erreur lors de la récupération des détails du produit eBay: {r.status_code} - {r.text}")
                return None
            
            return r.json()
        except Exception as e:
            print(f"Exception lors de la récupération des détails du produit eBay: {e}")
            return None

        token = self.get_access_token()
        if not token:
            return None

        url = f"https://api.ebay.com/buy/browse/v1/item/v1|{item_id}|0"
        headers = {
            "Authorization": f"Bearer {token}",
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_FR"
        }

        try:
            r = requests.get(url, headers=headers, timeout=10)
            if r.status_code != 200:
                print(f"Erreur lors de la récupération des enchères pour {item_id}: {r.status_code} - {r.text}")
                return None

            data = r.json()
            bidding = data.get("bidding", {})
            return {
                "item_id": item_id,
                "buying_options": data.get("buyingOptions"),
                "bid_count": bidding.get("bidCount"),
                "current_bid_price": bidding.get("currentPrice", {}).get("value"),
                "currency": bidding.get("currentPrice", {}).get("currency"),
                "minimum_next_bid": bidding.get("minimumBid", {}).get("value"),
                "auction_end": data.get("itemEndDate"),
                "raw": data
            }
        except Exception as e:
            print(f"Exception lors de la récupération des enchères eBay: {e}")
            return None