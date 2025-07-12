import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Recycle, Shirt, Users, Leaf, ArrowRight, Star, Heart } from 'lucide-react';

interface FeaturedItem {
  id: string;
  title: string;
  category: string;
  condition: string;
  point_value: number;
  item_images: { image_url: string }[];
}

const Index = () => {
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchFeaturedItems();
  }, []);

  const fetchFeaturedItems = async () => {
    try {
      const { data: items, error } = await supabase
        .from('items')
        .select(`
          id,
          title,
          category,
          condition,
          point_value,
          item_images (image_url)
        `)
        .eq('status', 'approved')
        .eq('is_available', true)
        .limit(6)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeaturedItems(items || []);
    } catch (error) {
      console.error('Error fetching featured items:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-secondary/20">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center space-x-2 mb-6 bg-primary/10 px-4 py-2 rounded-full">
                <Leaf className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Sustainable Fashion Platform</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Give Your Clothes a Second Life
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Join the ReWear community and reduce textile waste by swapping clothes with others. 
                Refresh your wardrobe sustainably while earning points for every item you share.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                {user ? (
                  <>
                    <Link to="/browse">
                      <Button size="lg" className="w-full sm:w-auto">
                        <Shirt className="h-5 w-5 mr-2" />
                        Browse Items
                      </Button>
                    </Link>
                    <Link to="/list-item">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto">
                        <Recycle className="h-5 w-5 mr-2" />
                        List an Item
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button size="lg" className="w-full sm:w-auto">
                        Start Swapping
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                    <Link to="/browse">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto">
                        Browse Items
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Impact Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">10,000+</div>
                  <div className="text-sm text-muted-foreground">Items Swapped</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">5,000+</div>
                  <div className="text-sm text-muted-foreground">Active Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">2.5 tons</div>
                  <div className="text-sm text-muted-foreground">CO₂ Saved</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-card/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How ReWear Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Recycle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">List Your Items</h3>
                <p className="text-muted-foreground">
                  Upload photos and details of clothes you no longer wear. Each approved item earns you points.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Swap or Redeem</h3>
                <p className="text-muted-foreground">
                  Browse items and either propose direct swaps or redeem with points you've earned.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Make an Impact</h3>
                <p className="text-muted-foreground">
                  Every swap reduces textile waste and helps create a more sustainable fashion future.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Items Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Featured Items</h2>
              <Link to="/browse">
                <Button variant="outline">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-square bg-muted rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : featuredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredItems.map((item) => (
                  <Card key={item.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {item.item_images && item.item_images.length > 0 ? (
                        <img
                          src={item.item_images[0].image_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Shirt className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                          {item.point_value} pts
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">{item.title}</h3>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="capitalize">{item.category}</span>
                        <span className="capitalize">{item.condition}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shirt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No featured items available yet.</p>
                {user && (
                  <Link to="/list-item">
                    <Button className="mt-4">Be the first to list an item!</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Start Your Sustainable Journey?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of fashion-conscious individuals making a positive impact on the environment.
            </p>
            {!user && (
              <Link to="/auth">
                <Button size="lg">
                  Join ReWear Today
                  <Heart className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
