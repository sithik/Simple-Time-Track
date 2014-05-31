<?php

function crud_get($table_name, $where = array(),$limit=null,$offset=null,$order_by_field=null,$order_by_order="ASC")
{
	$SQL = "SELECT * FROM `" . $table_name."` WHERE 1 ";
	foreach($where as $var => $val)
	{
		$SQL .= "AND `".$var ."` = '".$val."'";
	}
	if($limit != null and $offset!=null){
		$SQL .= " LIMIT ".$offset.",".$limit;
	}
	if($order_by_field != null){
		$SQL .= " ORDER BY `".$order_by_field."` ".$order_by_order."";
	}
	
	$result = mysql_query($SQL);
	if(mysql_num_rows($result) > 0)
	{
		$rows = array();
		while($row = mysql_fetch_assoc($result))
		{
			$rows[] = $row;
		}
		return $rows;
	}
	else{
		return false;
	}
}

function crud_get_row($table_name, $where = array(),$limit=null,$offset=null,$order_by_field=null,$order_by_order="ASC")
{
	$SQL = "SELECT * FROM `" . $table_name."` WHERE 1 ";
	foreach($where as $var => $val)
	{
		$SQL .= "AND `".$var ."` = '".$val."'";
	}
	if($limit != null and $offset!=null){
		$SQL .= " LIMIT ".$offset.",".$limit;
	}
	if($order_by_field != null){
		$SQL .= " ORDER BY `".$order_by_field."` ".$order_by_order."";
	}

	$result = mysql_query($SQL);
	if(mysql_num_rows($result) > 0)
	{
		$rows = array();
		while($row = mysql_fetch_assoc($result))
		{
			return $row;
		}
	}
	else{
		return false;
	}
}




function crud_insert($table_name,$data=array())
{
	$SQL = "INSERT INTO `" . $table_name."` (";
	foreach($data as $var => $val)
	{
		$SQL .= "`".$var ."`,";
	}
	$SQL = trim($SQL,",");
	$SQL .= ") VALUES (";
	foreach($data as $var => $val)
	{
		$SQL .= "'".$val."',";
	}
	$SQL = trim($SQL,",");
	$SQL .= ");";
	mysql_query($SQL);
	$id = mysql_insert_id();
	return $id;
}

function crud_update($table_name, $data = array(),$where = array())
{
	$SQL = "UPDATE " . $table_name." SET ";
	foreach($data as $var => $val)
	{
		$SQL .= "`".$var."` = '".$val."',";
	}
	$SQL = trim($SQL,",");
	$SQL .= " WHERE 1 ";
	foreach($where as $var => $val)
	{
		$SQL .= " AND `".$var ."` = '".$val."'";
	}
	if(mysql_query($SQL))
		return true;
	else
		return false;
}

function crud_delete($table_name, $where = array())
{
	$SQL = "DELETE FROM " . $table_name." WHERE 1 ";
	foreach($where as $var => $val)
	{
		$SQL .= " AND `".$var ."` = '".$val."'";
	}
	if(mysql_query($SQL))
		return true;
	else
		return false;
}

function get_manufacturer_products($order_id=0)
{
	$SQL = "SELECT DISTINCT manufacturer_id FROM `order_products` WHERE order_id = '".$order_id."'";
	$man_products = array();
	$result = mysql_query($SQL);
	if(mysql_num_rows($result) > 0)
	{
		while($row = mysql_fetch_assoc($result))
		{
			$man_products[$row['manufacturer_id']] = array();
			$SQL2 = "SELECT * FROM `order_products` WHERE manufacturer_id ='".$row['manufacturer_id']."' AND order_id = '".$order_id."'";
			$result2 = mysql_query($SQL2);
			if(mysql_num_rows($result2) > 0)
			{
				while($row2 = mysql_fetch_assoc($result2))
				{
						
					$man_products[$row['manufacturer_id']][] = array(
						'manufacturer_id' => $row2['manufacturer_id'],
						'product_id'	 => $row2['product_id'],
						'product_name' 	=> $row2['product_name'],
						'description'	=> $row2['description'],
						'packaging' 	=> $row2['packaging'],
						'units' 		=> $row2['units'],
						'qty' 			=> $row2['qty']
					);
				}
			}
		}
		return $man_products;
	}
	else{
		return false;
	}
}













function crud_customer_insert($table_name, $data = array())
{

	$SQL = "INSERT INTO  " . $table_name." (contact_name,company_name,address,phone_number,email_id,representative_id,pricing_model_id) VALUES (";
	$coma = '';
	foreach($data as $var => $val)
	{
	$SQL .= $coma."'$val'";
	$coma=',';
	}
	$SQL .=")";
	$result = mysql_query($SQL);
	return $result;
}
function crud_cart_insert($table_name, $data = array())
{

	$SQL = "INSERT INTO  " . $table_name."(customer_id) VALUES (";
	$coma = '';
	foreach($data as $var => $val)
	{
	$SQL .= $coma."'$val'";
	$coma=',';
	}
	$SQL .=")";
	$result = mysql_query($SQL);
	return $result;
}
function crud_cart_products_insert($table_name, $data = array())
{

	$SQL = "INSERT INTO  " . $table_name."(cart_id,product_id,part_number,manufacturer,description,product_image,unit_pkg,quantity_per_pkg,base_unit_price,qty) VALUES (";
	$coma = '';
	foreach($data as $var => $val)
	{
	$SQL .= $coma."'$val'";
	$coma=',';
	}
	$SQL .=")";
	$result = mysql_query($SQL);
	return $result;
}

















function get_product_price($product_id=0,$pricing_model_id=0)
{
	return get_customer_price($product_id,$pricing_model_id);
}

function update_cart_totals($cart_id = 0){
	$cart_total = 0;
	
	$SQL = "SELECT product_id,base_unit_price, qty FROM cart_products WHERE cart_id = '".$cart_id."'";
	$result = mysql_query($SQL);
	if(mysql_num_rows($result) > 0){
		while($row = mysql_fetch_assoc($result)){
			$product_price = get_product_price($row['product_id'],$_SESSION['login_data']['pricing_model_id']);
			$cart_total += $product_price * $row['qty'];
		}
	}
	
	$where = array('cart_id' => $cart_id);
	$data = array('total'=>$cart_total);
	crud_update('cart',$data,$where);
	
	return true;
}





/**
 * Get final price of the product
 */
function get_customer_price($product_id=0,$pricing_model_id=0){

	//-----
	$where = array('pricing_model_id'=>$pricing_model_id,'product_id'=>$product_id);
	$pricing_overrides = crud_get('pricing_overrides',$where);
	if($pricing_overrides!=false){
		// #3
		$product_overridden_price = $pricing_overrides[0]['overridden_price'];
		if($product_overridden_price == 0){
			return 0;
		}
	}
	else{
		$product_overridden_price = 0;
	}
	//-----
	if($product_overridden_price > 0){
		return $product_overridden_price;
	}
	else{
		//-----
		$product_base_price = 0;
		$pricing_model_discount_percentage = 0;
		//-----
		$where = array('product_id'=>$product_id);
		$products = crud_get('products',$where);
		if($products!=false){
			// #1
			$product_base_price = $products[0]['base_unit_price'];
		}
		else{
			return 0;
		}
		//-----
		$where = array('pricing_model_id'=>$pricing_model_id);
		$pricing_models = crud_get('pricing_models',$where);
		if($pricing_models!=false){
			$pricing_model_discount_percentage = $pricing_models[0]['discount_percentage'];
		}
		else{
			$pricing_model_discount_percentage = 0;
		}
		// #2
		$product_discounted_price = $product_base_price - ($product_base_price * $pricing_model_discount_percentage / 100);
		return $product_discounted_price;
	}
}



?>