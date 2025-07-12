import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Shirt, Plus, Star, Clock, CheckCircle, XCircle, Users, Coins } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  display_name: string;
  points: number;
}

interface UserItem {
  id: string;
  title: string;
  status: string;
  category: string;
  condition: string;
  point_value: number;
  created_at: string;
  item_images: { image_url: string }[];
}

interface UserSwap {
  id: string;
  status: string;
  exchange_type: string;
  points_used: number;
  message: string;
  created_at: string;
  items: {
    id: string;
    title: string;
    item_images: { image_url: string }[];
  };
  offered_items?: {
    id: string;
    title: string;
    item_images: { image_url: string }[];
  };
  profiles: { display_name: string };
}

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<UserItem[]>([]);
  const [swaps, setSwaps] = useState<UserSwap[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch user items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          id,
          title,
          status,
          category,
          condition,
          point_value,
          created_at,
          item_images (image_url)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Fetch user swaps (both as requester and owner)
      const { data: swapsData, error: swapsError } = await supabase
        .from('swaps')
        .select(`
          id,
          status,
          exchange_type,
          points_used,
          message,
          created_at,
          requester_id,
          owner_id,
          items (
            id,
            title,
            item_images (image_url)
          ),
          offered_items:offered_item_id (
            id,
            title,
            item_images (image_url)
          ),
          profiles:owner_id (display_name)
        `)
        .or(`requester_id.eq.${user!.id},owner_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });

      if (swapsError) throw swapsError;
      setSwaps(swapsData as any || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error loading dashboard',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view your dashboard.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.display_name}!</p>
          </div>
          <Link to="/list-item">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              List New Item
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Points</p>
                  <p className="text-2xl font-bold">{profile?.points || 0}</p>
                </div>
                <Coins className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Listed Items</p>
                  <p className="text-2xl font-bold">{items.length}</p>
                </div>
                <Shirt className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Swaps</p>
                  <p className="text-2xl font-bold">
                    {swaps.filter(swap => swap.status === 'pending' || swap.status === 'accepted').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList>
            <TabsTrigger value="items">My Items</TabsTrigger>
            <TabsTrigger value="swaps">My Swaps</TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle>My Listed Items</CardTitle>
                <CardDescription>Manage your listed items and track their approval status</CardDescription>
              </CardHeader>
              <CardContent>
                {items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <div className="aspect-square bg-muted relative">
                          {item.item_images && item.item_images.length > 0 ? (
                            <img
                              src={item.item_images[0].image_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Shirt className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge className={getStatusColor(item.status)}>
                              {getStatusIcon(item.status)}
                              <span className="ml-1 capitalize">{item.status}</span>
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-1">{item.title}</h3>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="capitalize">{item.category}</span>
                            <span>{item.point_value} pts</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Listed {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shirt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">You haven't listed any items yet.</p>
                    <Link to="/list-item">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        List Your First Item
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="swaps">
            <Card>
              <CardHeader>
                <CardTitle>My Swaps</CardTitle>
                <CardDescription>Track your swap requests and exchanges</CardDescription>
              </CardHeader>
              <CardContent>
                {swaps.length > 0 ? (
                  <div className="space-y-4">
                    {swaps.map((swap) => (
                      <Card key={swap.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(swap.status)}>
                                {getStatusIcon(swap.status)}
                                <span className="ml-1 capitalize">{swap.status}</span>
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {swap.exchange_type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(swap.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <p className="font-medium text-sm">Requested Item:</p>
                              <p className="text-sm text-muted-foreground">{swap.items.title}</p>
                            </div>
                            
                            {swap.exchange_type === 'direct_swap' && swap.offered_items ? (
                              <div className="flex-1">
                                <p className="font-medium text-sm">Offered Item:</p>
                                <p className="text-sm text-muted-foreground">{swap.offered_items.title}</p>
                              </div>
                            ) : (
                              <div className="flex-1">
                                <p className="font-medium text-sm">Points Used:</p>
                                <p className="text-sm text-muted-foreground">{swap.points_used} points</p>
                              </div>
                            )}
                          </div>
                          
                          {swap.message && (
                            <div className="mt-3 p-3 bg-muted rounded">
                              <p className="text-sm">{swap.message}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">You haven't made any swap requests yet.</p>
                    <Link to="/browse">
                      <Button>Browse Items to Swap</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}