var name_list = jQuery.sq.cookie("name_list");
jQuery.sq.ajax.mock["/JStar/Insert.json"]=function(req){
	if(name_list==null){name_list=new Array()}
	name_list[name_list.length]= req.name1;
	return {result:"ok",name_list: name_list};
};