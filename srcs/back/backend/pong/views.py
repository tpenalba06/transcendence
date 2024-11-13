from django.shortcuts import render, HttpResponse

def pong(request):
	return HttpResponse("hello")