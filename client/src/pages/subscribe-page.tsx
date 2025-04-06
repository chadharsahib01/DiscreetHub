import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Check, CreditCard, Lock, MessageSquare, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { subscribeMutation } = useAuth();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'An error occurred with your payment');
        toast({
          title: "Payment Failed",
          description: error.message || 'An error occurred with your payment',
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Call our subscription endpoint
        subscribeMutation.mutate({ paymentIntentId: paymentIntent.id }, {
          onSuccess: () => {
            toast({
              title: "Subscription Successful",
              description: "You now have premium access!",
            });
            navigate('/');
          },
          onError: (error) => {
            toast({
              title: "Error Activating Subscription",
              description: error.message || "There was an issue activating your subscription",
              variant: "destructive",
            });
          }
        });
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {errorMessage && (
        <div className="text-red-500 text-sm">{errorMessage}</div>
      )}
      
      <Button 
        disabled={isLoading || !stripe || !elements} 
        className="w-full py-6"
        type="submit"
      >
        {isLoading ? 'Processing...' : 'Subscribe Now - $9.99/month'}
      </Button>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        <Lock className="inline-block mr-1 h-3 w-3" />
        Your payment is secured with SSL encryption
      </div>
    </form>
  );
};

export default function SubscribePage() {
  const [clientSecret, setClientSecret] = useState("");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // If user is already premium, redirect to home
    if (user?.isPremium) {
      toast({
        title: "Already Subscribed",
        description: "You already have premium access",
      });
      navigate('/');
      return;
    }

    // Create PaymentIntent as soon as the page loads
    const createIntent = async () => {
      try {
        const res = await apiRequest("POST", "/api/create-payment-intent");
        const data = await res.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not initialize payment system",
          variant: "destructive",
        });
      }
    };

    createIntent();
  }, [user, navigate, toast]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 md:ml-64 relative overflow-y-auto">
        {/* Top Navigation Bar */}
        <header className="bg-white dark:bg-gray-900 shadow-sm z-10 sticky top-0">
          <div className="flex items-center justify-between h-16 px-4">
            <h1 className="text-xl font-bold">Premium Subscription</h1>
            
            {/* Right Menu Items */}
            <div className="flex items-center space-x-4">
              <button className="relative text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white p-1">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full"></span>
              </button>
              <button className="relative text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white p-1">
                <MessageSquare className="h-5 w-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Subscription Content */}
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex flex-col md:flex-row md:space-x-8 space-y-8 md:space-y-0 mb-8">
            <div className="md:w-7/12">
              <h2 className="text-2xl font-bold mb-4">Upgrade to Premium</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get unlimited access to all premium content and features on DiscreetHub.
              </p>

              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-lg text-white mb-6">
                <h3 className="text-xl font-bold mb-4">Premium Benefits</h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-white" />
                    <span>Unlimited access to premium content</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-white" />
                    <span>Ad-free browsing experience</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-white" />
                    <span>Priority access to new features</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-white" />
                    <span>Exclusive live streams and events</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-white" />
                    <span>Enhanced privacy features</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <Shield className="h-6 w-6 text-green-500 mr-2" />
                  <h3 className="text-lg font-medium">Our Privacy Promise</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Your privacy is our top priority. All billing information is processed securely through Stripe, and we never store your payment details. Your subscription activity is kept confidential and will never appear on bank statements.
                </p>
              </div>
            </div>

            <div className="md:w-5/12">
              <Card>
                <CardHeader>
                  <CardTitle>Premium Subscription</CardTitle>
                  <CardDescription>Billed monthly, cancel anytime</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">$9.99</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm />
                    </Elements>
                  ) : (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full rounded-md" />
                      <Skeleton className="h-12 w-full rounded-md" />
                      <Skeleton className="h-8 w-full rounded-md" />
                      <Skeleton className="h-12 w-full rounded-md" />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col">
                  <Separator className="mb-4" />
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <span>We accept all major credit cards</span>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}